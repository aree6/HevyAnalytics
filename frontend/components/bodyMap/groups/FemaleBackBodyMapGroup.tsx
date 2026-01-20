import * as React from "react";
import { FemaleBackBodyMapGroupPart1 } from "./femaleBack/FemaleBackBodyMapGroupPart1";
import { FemaleBackBodyMapGroupPart2 } from "./femaleBack/FemaleBackBodyMapGroupPart2";
const SVGComponent = (props) => (
  <svg
    viewBox="0 0 660.46 1206.46"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="h-80 col-span-2"
    {...props}
  >
    <FemaleBackBodyMapGroupPart1 />
    <FemaleBackBodyMapGroupPart2 />
  </svg>
);
export default SVGComponent;
