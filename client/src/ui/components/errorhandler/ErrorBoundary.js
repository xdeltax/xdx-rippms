import React from 'react';

export default class /*ErrorBoundary*/ extends React.Component {
  state = {
    hasError: false,
    error: null,
    errorInfo: null,
  }

  /*
  static getDerivedStateFromError = (error) => {
    global.error("ErrorBoundary:: +++ getDerivedStateFromError +++ ", error);
    // update state so the next render will show the fallback UI.
    return { hasError: true, }; // update state
  }
  */

  componentDidCatch(error, errorInfo) {
    global.error("ErrorBoundary:: +++ componentDidCatch +++:: ", error, errorInfo);
    this.setState({ hasError: true, error: error, errorInfo: errorInfo, });
  }

  render() {
    if (this.state.hasError) {
      global.error("ErrorBoundary:: render:: ", this.state.errorInfo);

      return (
        <div>
          <h2>Something went wrong</h2>
          <details style={{ whiteSpace: 'pre-wrap' }}>
            {this.state.error && this.state.error.toString()}
            <br />
            {this.state.errorInfo.componentStack}
          </details>
        </div>
      );
    }
    // Render children if there's no error
    return this.props.children;
  }
}
