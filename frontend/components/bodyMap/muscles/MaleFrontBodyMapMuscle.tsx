import * as React from "react";
import { MaleFrontBodyMapMusclePart1 } from "./maleFront/MaleFrontBodyMapMusclePart1";
import { MaleFrontBodyMapMusclePart2 } from "./maleFront/MaleFrontBodyMapMusclePart2";
const SVGComponent = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 676.49 1203.49"
    className="h-80 col-span-2"
    {...props}
  >
    <MaleFrontBodyMapMusclePart1 />
    <MaleFrontBodyMapMusclePart2 />
  </svg>
);
export default SVGComponent;
