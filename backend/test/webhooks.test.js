import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { normalizeTranscriptLines } from "../src/services/recallBots.js";
import {
  mapBotStatus,
  pick,
  resolveBotId,
  resolveMediaUrl,
  processRecallWebhook,
} from "../src/services/recallWebhooks.js";
import { db } from "../src/store/db.js";

describe("normalizeTranscriptLines", () => {
  it("flattens word arrays into speaker lines", () => {
    const lines = normalizeTranscriptLines([
      {
        speaker: "Alex",
        words: [
          { text: "Hello", start_timestamp: { relative: 1 } },
          { text: "Maya", end_timestamp: { relative: 2.5 } },
        ],
      },
    ]);
    assert.equal(lines.length, 1);
    assert.equal(lines[0].speaker, "Alex");
    assert.equal(lines[0].text, "Hello Maya");
    assert.equal(lines[0].startSeconds, 1);
    assert.equal(lines[0].endSeconds, 2.5);
  });

  it("reads nested results arrays", () => {
    const lines = normalizeTranscriptLines({
      results: [{ speaker: "Maya", text: "Thanks for having me.", start: 3, end: 5 }],
    });
    assert.equal(lines.length, 1);
    assert.equal(lines[0].text, "Thanks for having me.");
  });
});

describe("webhook helpers", () => {
  it("maps Recall bot status codes to interview statuses", () => {
    assert.equal(mapBotStatus("joining_call"), "joining");
    assert.equal(mapBotStatus("in_call_recording"), "in_call");
    assert.equal(mapBotStatus("done"), "processing");
    assert.equal(mapBotStatus("fatal"), "failed");
    assert.equal(mapBotStatus("unknown"), null);
  });

  it("resolves bot and media fields from nested payloads", () => {
    const data = {
      bot: { id: "bot_abc" },
      recording: {
        media_shortcuts: {
          video_mixed: { mp4: { data: { download_url: "https://cdn.example/video.mp4" } } },
        },
      },
    };
    assert.equal(resolveBotId("recording.done", data), "bot_abc");
    assert.equal(resolveMediaUrl(data), "https://cdn.example/video.mp4");
    assert.equal(pick(data, ["missing", "bot.id"]), "bot_abc");
  });
});

describe("processRecallWebhook", () => {
  it("updates interview + recording on recording.done", async () => {
    db.pausePersist();
    const hm = db.addHiringManager({
      name: "Test HM",
      email: `hm-${Date.now()}@example.com`,
      passwordHash: "x",
    });
    const { organization: org } = db.provisionTenantForUser(hm, {
      organizationName: "Test Org",
    });
    const candidate = db.addCandidate({
      name: "Cand",
      email: `cand-${Date.now()}@example.com`,
      orgId: org.id,
    });
    const job = db.addJobPosting({
      title: "Role",
      hiringManagerId: hm.id,
      orgId: org.id,
      status: "open",
    });
    const application = db.addApplication({
      candidateId: candidate.id,
      jobPostingId: job.id,
      stage: "phone_screen",
      orgId: org.id,
    });
    const interview = db.addInterview({
      candidateId: candidate.id,
      jobPostingId: job.id,
      applicationId: application.id,
      type: "phone_screen",
      status: "in_call",
      meetingUrl: "https://meet.google.com/test",
      botId: "bot_test_recording",
      orgId: org.id,
    });
    db.addBot({
      id: "bot_test_recording",
      interviewId: interview.id,
      meetingUrl: interview.meetingUrl,
      status: "in_call_recording",
    });

    const result = await processRecallWebhook({
      event: "recording.done",
      data: {
        bot: { id: "bot_test_recording" },
        recording: {
          id: "rec_1",
          media_shortcuts: {
            video_mixed: {
              mp4: { data: { download_url: "https://cdn.example/rec.mp4" } },
            },
          },
        },
      },
    });

    assert.equal(result.matched, true);
    const updated = db.getInterview(interview.id);
    assert.equal(updated.recordingId, "rec_1");
    assert.equal(updated.status, "processing");
    assert.equal(db.getRecording("rec_1")?.mediaUrl, "https://cdn.example/rec.mp4");

    const transcriptResult = await processRecallWebhook({
      event: "transcript.done",
      data: {
        bot: { id: "bot_test_recording" },
        transcript: [
          { speaker: "Alex", text: "Hello", start: 0, end: 1 },
          { speaker: "Cand", text: "Hi there", start: 1, end: 2 },
        ],
      },
    });

    assert.equal(transcriptResult.matched, true);
    assert.equal(transcriptResult.lineCount, 2);
    const ready = db.getInterview(interview.id);
    assert.equal(ready.status, "ready");
    assert.ok(ready.transcriptId);
  });
});
