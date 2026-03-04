import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { db } from '../../firebase';
import {
	collection,
	query,
	where,
	onSnapshot,
} from 'firebase/firestore';

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
