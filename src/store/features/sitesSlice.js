import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import {
	addDoc,
	collection,
	deleteDoc,
	doc,
	onSnapshot,
	query,
	serverTimestamp,
	updateDoc,
	where,
} from 'firebase/firestore';
import { db } from '../../firebase';

export const subscribeToSites = createAsyncThunk(
	'sites/subscribe',
	async ({ uid }, { dispatch }) => {
		try {
			const q = query(
				collection(db, 'sites'),
				where('userId', '==', uid),
			);

			const unsubscribe = onSnapshot(q, snapshot => {
				const data = snapshot.docs.map(doc => ({
					id: doc.id,
					...doc.data(),
					createdAt: doc.data()?.createdAt?.toDate() || '',
				}));
				dispatch(setSites(data));
			});

			return unsubscribe;
		} catch (err) {
			dispatch(setSitesError(err.message));
		}
	},
);

export const saveSite = createAsyncThunk(
	'sites/saveSite',
	async ({ formData, user, isEditMode, siteId }, { rejectWithValue }) => {
		try {
			const sitePayload = {
				siteName: formData.siteName.trim(),
				postalCode: formData.postalCode?.toUpperCase().trim() || '',
				userId: user.uid,
				employerId: formData.employerId,
				updatedAt: serverTimestamp(),
				mode: import.meta.env.VITE_MODE,
			};

			if (isEditMode && siteId) {
				console.log(sitePayload);
				await updateDoc(doc(db, 'sites', siteId), sitePayload);
				return { id: siteId, ...sitePayload };
			} else {
				const newRef = await addDoc(collection(db, 'sites'), {
					...sitePayload,
					createdAt: serverTimestamp(),
				});
				return { id: newRef.id, ...sitePayload };
			}
		} catch (error) {
			return rejectWithValue(error.message);
		}
	},
);

export const deleteSite = createAsyncThunk(
	'sites/deleteSite',
	async (siteId, { rejectWithValue }) => {
		try {
			const siteRef = doc(db, 'sites', siteId);
			await deleteDoc(siteRef);
			return siteId; // Return the ID so we can remove it from state
		} catch (error) {
			return rejectWithValue(error.message);
		}
	},
);

const sitesSlice = createSlice({
	name: 'sites',
	initialState: {
		data: [],
		status: 'idle',
		error: null,
	},
	reducers: {
		setSites: (state, action) => {
			state.data = action.payload;
			state.status = 'succeeded';
		},
		setSitesError: (state, action) => {
			state.status = 'failed';
			state.error = action.payload;
		},
		setSitesLoading: state => {
			state.status = 'loading';
		},
	},
});

export const { setSites, setSitesError, setSitesLoading } = sitesSlice.actions;

export default sitesSlice.reducer;
