import * as React from "react";
import { FemaleFrontBodyMapMusclePart1 } from "./femaleFront/FemaleFrontBodyMapMusclePart1";
import { FemaleFrontBodyMapMusclePart2 } from "./femaleFront/FemaleFrontBodyMapMusclePart2";
const SVGComponent = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 676.49 1203.49"
    className="h-80 col-span-2"
    {...props}
  >
    <FemaleFrontBodyMapMusclePart1 />
    <FemaleFrontBodyMapMusclePart2 />
  </svg>
);
export default SVGComponent;
