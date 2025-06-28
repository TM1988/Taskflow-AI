import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAuth } from '@/services/firebase/admin';
import { getFirestore } from 'firebase-admin/firestore';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;
    const auth = getFirebaseAuth();
    const firestore = getFirestore();

    // Get user data from Firebase Auth
    const userRecord = await auth.getUser(userId);
    
    // Get additional profile data from Firestore
    const userDoc = await firestore.collection('users').doc(userId).get();
    const userData = userDoc.data();

    // Get task statistics
    const tasksQuery = await firestore
      .collection('tasks')
      .where('assigneeId', '==', userId)
      .where('status', '==', 'completed')
      .get();

    // Get project contributions (count unique projects where user has tasks)
    const allTasksQuery = await firestore
      .collection('tasks')
      .where('assigneeId', '==', userId)
      .get();

    const uniqueProjects = new Set();
    allTasksQuery.docs.forEach((doc: any) => {
      const task = doc.data();
      if (task.projectId) {
        uniqueProjects.add(task.projectId);
      }
    });

    const profileData = {
      id: userRecord.uid,
      displayName: userRecord.displayName || userData?.displayName || 'User',
      email: userRecord.email || '',
      photoURL: userRecord.photoURL || userData?.photoURL || null,
      createdAt: userRecord.metadata.creationTime,
      lastSignInTime: userRecord.metadata.lastSignInTime,
      bio: userData?.bio || '',
      role: userData?.role || 'Member',
      tasksCompleted: tasksQuery.size,
      projectsContributed: uniqueProjects.size,
    };

    return NextResponse.json(profileData);
  } catch (error: any) {
    console.error('Error fetching profile:', error);
    
    if (error.code === 'auth/user-not-found') {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;
    const body = await request.json();
    const { displayName, bio, photoURL } = body;
    
    const auth = getFirebaseAuth();
    const firestore = getFirestore();

    // Update user record in Firebase Auth (if display name or photo changed)
    const updateData: any = {};
    if (displayName !== undefined) {
      updateData.displayName = displayName;
    }
    if (photoURL !== undefined) {
      updateData.photoURL = photoURL;
    }

    if (Object.keys(updateData).length > 0) {
      await auth.updateUser(userId, updateData);
    }

    // Update additional data in Firestore
    const firestoreUpdate: any = {};
    if (displayName !== undefined) firestoreUpdate.displayName = displayName;
    if (bio !== undefined) firestoreUpdate.bio = bio;
    if (photoURL !== undefined) firestoreUpdate.photoURL = photoURL;
    
    if (Object.keys(firestoreUpdate).length > 0) {
      await firestore.collection('users').doc(userId).set(
        firestoreUpdate,
        { merge: true }
      );
    }

    // Return updated profile data
    const userRecord = await auth.getUser(userId);
    const userDoc = await firestore.collection('users').doc(userId).get();
    const userData = userDoc.data();

    const profileData = {
      id: userRecord.uid,
      displayName: userRecord.displayName || userData?.displayName || 'User',
      email: userRecord.email || '',
      photoURL: userRecord.photoURL || userData?.photoURL || null,
      createdAt: userRecord.metadata.creationTime,
      lastSignInTime: userRecord.metadata.lastSignInTime,
      bio: userData?.bio || '',
      role: userData?.role || 'Member',
    };

    return NextResponse.json(profileData);
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
