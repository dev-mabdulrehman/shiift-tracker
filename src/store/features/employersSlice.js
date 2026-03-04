import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { db } from '../../firebase';
import {
	collection,
	query,
	where,
	onSnapshot,
} from 'firebase/firestore';

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

export const { setEmployers, setEmployersError, setEmployersLoading } = employersSlice.actions;

export default employersSlice.reducer;
