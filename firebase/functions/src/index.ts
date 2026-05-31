import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { logger } from 'firebase-functions/v2';
import * as admin from 'firebase-admin';

admin.initializeApp();

const db = admin.firestore();
const messaging = admin.messaging();

const EVENT_ID = 'main';

// ─── Trigger: New assignment created → send push to participant ───────────────

export const onAssignmentCreated = onDocumentCreated(
  { document: `events/${EVENT_ID}/assignments/{assignmentId}`, region: 'europe-central2' },
  async (event) => {
    const snap = event.data;
    if (!snap) return;
    const assignment = snap.data();
    if (!assignment) return;

    const { participantId, taskId } = assignment;

    // Fetch task title
    const taskSnap = await db
      .doc(`events/${EVENT_ID}/tasks/${taskId}`)
      .get();
    const task = taskSnap.data();
    if (!task) return;

    // Fetch participant's push token
    const participantSnap = await db
      .doc(`events/${EVENT_ID}/participants/${participantId}`)
      .get();
    const participant = participantSnap.data();
    if (!participant?.pushToken) return;

    const { pushToken, name } = participant;

    const message: admin.messaging.Message = {
      token: pushToken,
      notification: {
        title: `🎯 New Task, ${name}!`,
        body: task.title,
      },
      data: {
        assignmentId: event.params.assignmentId,
        taskId,
        participantId,
        taskTitle: task.title,
        type: 'NEW_TASK',
      },
      android: {
        priority: 'high',
        notification: {
          channelId: 'tasks',
          color: '#7c3aed',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
    };

    try {
      await messaging.send(message);
      logger.info(`Push sent to ${name} (${participantId}) for task ${task.title}`);
    } catch (error) {
      logger.error('Failed to send push notification:', error);
    }
  });

// ─── Trigger: Submission verdict set → update participant score ───────────────

export const onSubmissionVerdict = onDocumentUpdated(
  { document: `events/${EVENT_ID}/submissions/{submissionId}`, region: 'europe-central2' },
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    if (!before || !after) return;

    // Only act when verdict is newly set
    if (before.verdict === after.verdict || !after.verdict) return;

    const { participantId, pointsAwarded } = after;
    if (typeof pointsAwarded !== 'number') return;

    const participantRef = db.doc(`events/${EVENT_ID}/participants/${participantId}`);

    await participantRef.update({
      score: admin.firestore.FieldValue.increment(pointsAwarded),
    });

    logger.info(
      `Score updated for ${participantId}: +${pointsAwarded} points (verdict: ${after.verdict})`
    );
  });

