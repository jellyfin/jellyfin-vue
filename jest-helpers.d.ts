/* eslint-disable @typescript-eslint/no-explicit-any */
import { ActionContext } from 'vuex';
import { RootState } from '~/store';

type ModuleAction<ModuleState> = (
  injectee: ActionContext<ModuleState, RootState>,
  payload: any
) => any;
