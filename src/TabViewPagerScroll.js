/* @flow */

import React, { PureComponent, Children, PropTypes } from 'react';
import {
  Animated,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { PagerPropsPropType } from './TabViewPropTypes';
import type { PagerProps } from './TabViewTypeDefinitions';

type ScrollEvent = {
  nativeEvent: {
    contentOffset: {
      x: number;
      y: number;
    };
  };
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
});

type Props = PagerProps & {
  swipeEnabled?: boolean;
  children?: any;
}

export default class TabViewPagerScroll extends PureComponent<void, Props, void> {
  static propTypes = {
    ...PagerPropsPropType,
    swipeEnabled: PropTypes.bool,
    children: PropTypes.node,
  };

  static normalize = (props: PagerProps) => {
    if (props.layout.width) {
      return Animated.divide(props.progress, props.layout.width);
    } else {
      return new Animated.Value(props.navigationState.index);
    }
  };

  componentDidMount() {
    this._scrollTo(this.props.navigationState.index * this.props.layout.width);
  }

  componentDidUpdate(prevProps: Props) {
    if (prevProps.layout !== this.props.layout || Children.count(prevProps.children) !== Children.count(this.props.children)) {
      global.requestAnimationFrame(() =>
        this._scrollTo(this.props.navigationState.index * this.props.layout.width)
      );
    }
  }

  _scrollView: Object;

  _scrollTo = (x: number) => {
    if (this._scrollView) {
      this._scrollView.scrollTo({
        x,
        animated: false,
      });
    }
  };

  _handleMomentumScrollEnd = (e: ScrollEvent) => {
    const nextIndex = Math.round(e.nativeEvent.contentOffset.x / this.props.layout.width);
    this.props.jumpToIndex(nextIndex);
  };

  _setRef = (el: Object) => (this._scrollView = el);

  render() {
    const { children } = this.props;
    const single = Children.count(children) === 1;
    return (
      <ScrollView
        horizontal
        pagingEnabled
        directionalLockEnabled
        keyboardDismissMode='on-drag'
        keyboardShouldPersistTaps='always'
        scrollEnabled={this.props.swipeEnabled}
        automaticallyAdjustContentInsets={false}
        bounces={false}
        alwaysBounceHorizontal={false}
        scrollsToTop={false}
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event([ {
          nativeEvent: {
            contentOffset: { x: this.props.offset },
          },
        } ], {
          useNativeDriver: true,
        })}
        onMomentumScrollEnd={this._handleMomentumScrollEnd}
        contentOffset={{ x: this.props.navigationState.index * this.props.layout.width, y: 0 }}
        style={styles.container}
        contentContainerStyle={single ? styles.container : null}
        ref={this._setRef}
      >
        <View style={single ? styles.container : styles.row}>
          {children}
        </View>
      </ScrollView>
    );
  }
}
