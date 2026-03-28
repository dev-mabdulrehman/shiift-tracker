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

export const subscribeToEmployers = createAsyncThunk(
	'employers/subscribe',
	async ({ uid }, { dispatch }) => {
		try {
			const q = query(
				collection(db, 'employers'),
				where('userId', '==', uid),
			);

			const unsubscribe = onSnapshot(q, snapshot => {
				const data = snapshot.docs.map(doc => ({
					id: doc.id,
					...doc.data(),
					createdAt: doc.data()?.createdAt?.toDate() || '',
				}));
				dispatch(setEmployers(data));
			});

			return unsubscribe;
		} catch (err) {
			dispatch(setEmployersError(err.message));
		}
	},
);

export const saveEmployer = createAsyncThunk(
	'employers/saveEmployer',
	async ({ formData, user, isEditMode, employerId }, { rejectWithValue }) => {
		try {
			// 1. Prepare Payload
			const employerPayload = {
				name: formData.name.trim(),
				defaultRate: parseFloat(formData.defaultRate) || 0,
				notes: formData.notes?.trim() || '',
				userId: user.uid,
				updatedAt: serverTimestamp(),
				// Keeping your environment mode tracking
				mode: import.meta.env.VITE_MODE || 'development',
			};

			// 2. Save or Update Logic
			if (isEditMode && employerId) {
				const empRef = doc(db, 'employers', employerId);
				await updateDoc(empRef, employerPayload);

				return { id: employerId, ...employerPayload };
			} else {
				// For new records, add the createdAt timestamp
				const newEmpRef = await addDoc(collection(db, 'employers'), {
					...employerPayload,
					createdAt: serverTimestamp(),
				});

				return { id: newEmpRef.id, ...employerPayload };
			}
		} catch (error) {
			console.error('Employer Save Error:', error.message);
			return rejectWithValue(error.message);
		}
	},
);

export const deleteEmployer = createAsyncThunk('employers/delete', async id => {
	await deleteDoc(doc(db, 'employers', id));
	return id;
});

const employersSlice = createSlice({
	name: 'employers',
	initialState: {
		data: [],
		status: 'idle',
		error: null,
	},
	reducers: {
		setEmployers: (state, action) => {
			state.data = action.payload;
			state.status = 'succeeded';
		},
		setEmployersError: (state, action) => {
			state.status = 'failed';
			state.error = action.payload;
		},
		setEmployersLoading: state => {
			state.status = 'loading';
		},
	},
});

export const { setEmployers, setEmployersError, setEmployersLoading } =
	employersSlice.actions;

export default employersSlice.reducer;
