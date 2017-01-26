/* @flow */

import React, { PureComponent, PropTypes } from 'react';
import {
  Animated,
  View,
} from 'react-native';
import { NavigationStatePropType } from './TabViewPropTypes';
import type { PagerProps, Layout } from './TabViewTypeDefinitions';
import type { TransitionerProps } from './TabViewTransitionerTypes';

type DefaultProps = {
  initialLayout: Layout;
}

type Props = TransitionerProps & {
  render: (props: PagerProps) => ?React.Element<*>;
}

type State = {
  layout: Layout & {
    measured: boolean;
  };
  progress: Animated.Value;
  offset: Animated.Value;
}

export default class TabViewTransitioner extends PureComponent<DefaultProps, Props, State> {
  static propTypes = {
    navigationState: NavigationStatePropType.isRequired,
    render: PropTypes.func.isRequired,
    onRequestChangeTab: PropTypes.func.isRequired,
    onChangePosition: PropTypes.func,
    initialLayout: PropTypes.shape({
      height: PropTypes.number.isRequired,
      width: PropTypes.number.isRequired,
    }),
    canJumpToTab: PropTypes.func,
  };

  static defaultProps = {
    initialLayout: {
      height: 0,
      width: 0,
    },
  };

  constructor(props: Props) {
    super(props);

    this.state = {
      layout: {
        ...this.props.initialLayout,
        measured: false,
      },
      progress: new Animated.Value(0),
      offset: new Animated.Value(this.props.navigationState.index),
    };
  }

  state: State;

  _handleChangePosition = () => {
    // TODO: Figure out a way to listen to position
  }

  _handleLayout = (e: any) => {
    const { height, width } = e.nativeEvent.layout;

    if (this.state.layout.width === width && this.state.layout.height === height) {
      return;
    }

    this.setState({
      layout: {
        measured: true,
        height,
        width,
      },
    });
  };

  _buildPagerProps = (): PagerProps => {
    return {
      ...this.state,
      navigationState: this.props.navigationState,
      jumpToIndex: this._jumpToIndex,
    };
  }

  _jumpToIndex = (index: number) => {
    if (!this._mounted) {
      // We are no longer mounted, this is a no-op
      return;
    }

    const { canJumpToTab, navigationState } = this.props;

    if (canJumpToTab && !canJumpToTab(navigationState.routes[index])) {
      return;
    }

    this.props.onRequestChangeTab(index);
  };

  render() {
    return (
      <View {...this.props} onLayout={this._handleLayout}>
        {this.props.render(this._buildPagerProps())}
      </View>
    );
  }
}
