import React from 'react';

export default class ScrollToTop extends React.Component {
  componentDidUpdate(prevProps) {
    if (this.props.location && prevProps.location && this.props.location.pathname !== prevProps.location.pathname) 
    window.scrollTo(0, 0);
  }

  render() {
    return null;
  }
}
