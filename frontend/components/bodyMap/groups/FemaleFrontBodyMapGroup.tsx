import * as React from "react";
import { FemaleFrontBodyMapGroupPart1 } from "./femaleFront/FemaleFrontBodyMapGroupPart1";
import { FemaleFrontBodyMapGroupPart2 } from "./femaleFront/FemaleFrontBodyMapGroupPart2";
const SVGComponent = (props) => (
  <svg
    viewBox="0 0 660.46 1206.46"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="h-80 col-span-2"
    {...props}
  >
    <FemaleFrontBodyMapGroupPart1 />
    <FemaleFrontBodyMapGroupPart2 />
  </svg>
);
export default SVGComponent;
