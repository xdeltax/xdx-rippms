import React, { PureComponent } from "react";

const withStyles = styleGenerator => WrappedComponent =>
  class StyledComponent extends PureComponent {
    render() {
      const computedStyles = styleGenerator(this.props);

      return (
        <WrappedComponent {...this.props} computedStyles={computedStyles} />
      );
    }
  };

export default withStyles;
