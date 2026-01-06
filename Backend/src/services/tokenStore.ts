import { db } from '../config/firebase.config';

interface StravaTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export class TokenStore {
  private collection = db.collection('users');

  async setTokens(userId: string, tokens: StravaTokens): Promise<void> {
    await this.collection.doc(userId).set({
      strava: tokens,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
  }

  async getTokens(userId: string): Promise<StravaTokens | null> {
    const doc = await this.collection.doc(userId).get();
    if (!doc.exists) return null;
    
    const data = doc.data();
    return data?.strava || null;
  }

  async deleteTokens(userId: string): Promise<void> {
    await this.collection.doc(userId).update({
      strava: admin.firestore.FieldValue.delete(),
    });
  }
}

export default new TokenStore();
