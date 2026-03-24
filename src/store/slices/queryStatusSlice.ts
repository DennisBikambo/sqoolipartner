import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

export type QueryStatus = "idle" | "loading" | "error" | "success";

interface QueryStatusState {
  statuses: Record<string, QueryStatus>;
  errors: Record<string, string>;
}

const initialState: QueryStatusState = {
  statuses: {},
  errors: {},
};

const queryStatusSlice = createSlice({
  name: "queryStatus",
  initialState,
  reducers: {
    setQueryLoading(state, action: PayloadAction<string>) {
      state.statuses[action.payload] = "loading";
      delete state.errors[action.payload];
    },
    setQuerySuccess(state, action: PayloadAction<string>) {
      state.statuses[action.payload] = "success";
      delete state.errors[action.payload];
    },
    setQueryError(state, action: PayloadAction<{ key: string; error: string }>) {
      state.statuses[action.payload.key] = "error";
      state.errors[action.payload.key] = action.payload.error;
    },
  },
});

export const { setQueryLoading, setQuerySuccess, setQueryError } = queryStatusSlice.actions;
export default queryStatusSlice.reducer;
