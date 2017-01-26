/* @flow */

import type { NavigationState, Route, Layout } from './TabViewTypeDefinitions';

export type TransitionerProps = {
  navigationState: NavigationState;
  onRequestChangeTab: (index: number) => void;
  onChangePosition?: (value: number) => void;
  initialLayout?: Layout;
  canJumpToTab?: (route: Route) => boolean;
  shouldOptimizeUpdates?: boolean;
}
