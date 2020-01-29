import React from "react";
import { useLocation } from "react-router-dom";
export default () => {
  let location = useLocation();

  return (
    <div>
      <h3>
      Route Register <code>{location.pathname}</code>
      </h3>
    </div>
  );
}
