import { configureStore } from "@reduxjs/toolkit";
import queryStatusReducer from "./slices/queryStatusSlice";

export const store = configureStore({
  reducer: {
    queryStatus: queryStatusReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
