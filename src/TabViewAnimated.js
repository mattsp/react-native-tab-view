/* @flow */

import React, { PureComponent, PropTypes } from 'react';
import {
  Animated,
  Platform,
  StyleSheet,
  View,
} from 'react-native';
import TabViewTransitioner from './TabViewTransitioner';
import { NavigationStatePropType } from './TabViewPropTypes';
import type { Scene, SceneRendererProps, PagerProps } from './TabViewTypeDefinitions';
import type { TransitionerProps } from './TabViewTransitionerTypes';

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    overflow: 'hidden',
  },
});

type DefaultProps = {
  renderPager: (props: PagerProps) => React.Element<*>;
}

type Props = TransitionerProps & {
  renderPager: (props: PagerProps) => React.Element<*>;
  renderScene: (props: SceneRendererProps & Scene) => ?React.Element<*>;
  renderHeader?: (props: SceneRendererProps) => ?React.Element<*>;
  renderFooter?: (props: SceneRendererProps) => ?React.Element<*>;
  lazy?: boolean;
}

type State = {
  loaded: Array<number>;
}

let TabViewPager;

switch (Platform.OS) {
case 'android':
  TabViewPager = require('./TabViewPagerAndroid').default;
  break;
case 'ios':
  TabViewPager = require('./TabViewPagerScroll').default;
  break;
default:
  TabViewPager = require('./TabViewPagerPan').default;
  break;
}

export default class TabViewAnimated extends PureComponent<DefaultProps, Props, State> {
  static propTypes = {
    navigationState: NavigationStatePropType.isRequired,
    renderPager: PropTypes.func.isRequired,
    renderScene: PropTypes.func.isRequired,
    renderHeader: PropTypes.func,
    renderFooter: PropTypes.func,
    onChangePosition: PropTypes.func,
    lazy: PropTypes.bool,
  };

  static defaultProps = {
    renderPager: (props: PagerProps) => <TabViewPager {...props} />,
  };

  constructor(props: Props) {
    super(props);

    this.state = {
      loaded: [ this.props.navigationState.index ],
    };
  }

  state: State;

  componentWillMount() {
    const pager = this.props.renderPager({
      layout: { height: 0, width: 0, measured: false },
      navigationState: this.props.navigationState,
      progress: new Animated.Value(0),
      offset: new Animated.Value(this.props.navigationState.index),
      jumpToIndex: () => {},
    });
    this._normalize = pager.type.normalize;
  }

  _normalize: (props: PagerProps) => Animated.Value;

  _renderScene = (props: SceneRendererProps & Scene) => {
    const { renderScene, navigationState, lazy } = this.props;
    const { loaded } = this.state;
    if (lazy) {
      if (loaded.includes(navigationState.routes.indexOf(props.route))) {
        return renderScene(props);
      }
      return null;
    }
    return renderScene(props);
  };

  _renderItems = (props: PagerProps) => {
    const { renderPager, renderHeader, renderFooter } = this.props;
    const { navigationState, layout } = props;
    const currentRoute = navigationState.routes[navigationState.index];
    const sceneRendererProps = {
      ...props,
      position: this._normalize(props),
    };

    return (
      <View style={styles.container}>
        {renderHeader && renderHeader(sceneRendererProps)}
        {renderPager({
          ...props,
          children: layout.width ? navigationState.routes.map((route, index) => (
            <View key={route.key} style={{ width: layout.width, overflow: 'hidden' }}>
              {this._renderScene({
                ...sceneRendererProps,
                route,
                index,
                focused: index === props.navigationState.index,
              })}
            </View>
          )) : (
            <View key={currentRoute.key} style={styles.container}>
              {this._renderScene({
                ...sceneRendererProps,
                route: currentRoute,
                index: navigationState.index,
                focused: true,
              })}
            </View>
          ),
        })}
        {renderFooter && renderFooter(sceneRendererProps)}
      </View>
    );
  };

  _handleChangePosition = (value: number) => {
    const { onChangePosition, navigationState, lazy } = this.props;
    if (onChangePosition) {
      onChangePosition(value);
    }
    const { loaded } = this.state;
    if (lazy) {
      let next = Math.ceil(value);
      if (next === navigationState.index) {
        next = Math.floor(value);
      }
      if (loaded.includes(next)) {
        return;
      }
      this.setState({
        loaded: [ ...loaded, next ],
      });
    }
  };

  render() {
    return (
      <TabViewTransitioner
        {...this.props}
        loaded={this.state.loaded}
        onChangePosition={this._handleChangePosition}
        render={this._renderItems}
      />
    );
  }
}
