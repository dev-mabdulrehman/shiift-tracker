import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import {
	addDoc,
	collection,
	deleteDoc,
	doc,
	onSnapshot,
	orderBy,
	query,
	serverTimestamp,
	updateDoc,
	where,
} from 'firebase/firestore';
import { db } from '../../firebase';

// --- EXISTING LISTENER THUNK ---
export const subscribeToShifts = createAsyncThunk(
	'shifts/subscribe',
	async ({ selectedMonth, uid }, { dispatch }) => {
		const start = `${selectedMonth}-01`;
		const end = `${selectedMonth}-31`;
		const q = query(
			collection(db, 'shifts'),
			where('userId', '==', uid),
			where('date', '>=', start),
			where('date', '<=', end),
			orderBy('date', 'desc'),
		);

		const unsubscribe = onSnapshot(
			q,
			snapshot => {
				const data = snapshot.docs.map(doc => ({
					id: doc.id,
					...doc.data(),
					createdAt:
						doc.data()?.createdAt?.toDate()?.toISOString() || '',
					updatedAt:
						doc.data()?.updatedAt?.toDate()?.toISOString() || '',
				}));
				dispatch(setShifts(data));
			},
			error => {
				dispatch(setShiftsError(error.message));
			},
		);

		return unsubscribe; // Component must call this to cleanup
	},
);

// --- NEW: SAVE/UPDATE THUNK ---
export const saveShift = createAsyncThunk(
	'shifts/saveShift',
	async (
		{ formData, user, employers, sites, isEditMode, shiftId },
		{ rejectWithValue },
	) => {
		try {
			// 1. Employer Logic
			let employerId;
			const existingEmp = employers.find(
				item =>
					item.name.toLowerCase().trim() ===
					formData.employer.toLowerCase().trim(),
			);

			if (existingEmp) {
				employerId = existingEmp.id;
			} else {
				const newEmpRef = await addDoc(collection(db, 'employers'), {
					name: formData.employer.trim(),
					defaultRate: formData.hourlyRate,
					userId: user.uid,
					createdAt: serverTimestamp(),
					mode: import.meta.env.VITE_MODE,
				});
				employerId = newEmpRef.id;
			}

			// 2. Site Logic
			let siteId;
			const existingSite = sites.find(
				item =>
					item.siteName.toLowerCase().trim() ===
					formData.siteName.toLowerCase().trim(),
			);

			if (existingSite) {
				siteId = existingSite.id;
			} else {
				const newSiteRef = await addDoc(collection(db, 'sites'), {
					siteName: formData.siteName.trim(),
					postalCode: formData.postalCode.toUpperCase().trim(),
					userId: user.uid,
					createdAt: serverTimestamp(),
					mode: import.meta.env.VITE_MODE,
				});
				siteId = newSiteRef.id;
			}

			// 3. Shift Payload Construction
			const rate = parseFloat(formData.hourlyRate) || 0;
			const hrs = parseFloat(formData.hours) || 0;

			const shiftPayload = {
				date: formData.date,
				startTime: formData.startTime,
				endTime: formData.endTime, // Assumes this is passed in formData now
				hours: hrs,
				hourlyRate: rate,
				totalEarnings: rate * hrs,
				employerId,
				siteId,
				userId: user.uid,
				updatedAt: serverTimestamp(),
				status: formData.status,
				mode: import.meta.env.VITE_MODE,
			};

			// 4. Save or Update
			if (isEditMode) {
				await updateDoc(doc(db, 'shifts', shiftId), shiftPayload);
				return { id: shiftId, ...shiftPayload };
			} else {
				const newShiftRef = await addDoc(collection(db, 'shifts'), {
					...shiftPayload,
					createdAt: serverTimestamp(),
					mode: import.meta.env.VITE_MODE,
				});
				return { id: newShiftRef.id, ...shiftPayload };
			}
		} catch (error) {
			console.log(error.message);
			return rejectWithValue(error.message);
		}
	},
);

// --- NEW: DELETE THUNK ---
export const deleteShift = createAsyncThunk(
	'shifts/deleteShift',
	async (shiftId, { rejectWithValue }) => {
		try {
			await deleteDoc(doc(db, 'shifts', shiftId));
			return shiftId;
		} catch (error) {
			return rejectWithValue(error.message);
		}
	},
);

const shiftsSlice = createSlice({
	name: 'shifts',
	initialState: {
		data: [],
		status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
		error: null,
	},
	reducers: {
		setShifts: (state, action) => {
			state.data = action.payload;
			state.status = 'succeeded';
		},
		setShiftsError: (state, action) => {
			state.status = 'failed';
			state.error = action.payload;
		},
	},
	extraReducers(builder) {
		builder
			// Save Shift Cases
			.addCase(saveShift.pending, state => {
				state.status = 'loading';
			})
			.addCase(saveShift.fulfilled, state => {
				state.status = 'succeeded';
				// Note: The listener handles updating state.data,
				// so we don't need to manually update it here.
			})
			.addCase(saveShift.rejected, (state, action) => {
				state.status = 'failed';
				state.error = action.payload;
			})
			// Delete Shift Cases
			.addCase(deleteShift.pending, state => {
				state.status = 'loading';
			})
			.addCase(deleteShift.fulfilled, state => {
				state.status = 'succeeded';
			})
			.addCase(deleteShift.rejected, (state, action) => {
				state.status = 'failed';
				state.error = action.payload;
			});
	},
});

export const { setShifts, setShiftsError } = shiftsSlice.actions;
export default shiftsSlice.reducer;
