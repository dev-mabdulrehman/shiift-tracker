import { configureStore } from '@reduxjs/toolkit';
import shiftReducer from './features/shiftSlice';
import sitesReducer from './features/sitesSlice';
import employersReducer from './features/employersSlice';

export const store = configureStore({
	reducer: {
		shifts: shiftReducer,
		sites: sitesReducer,
		employers: employersReducer,
	},
});
