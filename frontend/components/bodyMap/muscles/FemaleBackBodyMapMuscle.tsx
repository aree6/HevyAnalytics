import * as React from "react";
import { FemaleBackBodyMapMusclePart1 } from "./femaleBack/FemaleBackBodyMapMusclePart1";
import { FemaleBackBodyMapMusclePart2 } from "./femaleBack/FemaleBackBodyMapMusclePart2";
const SVGComponent = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 676.49 1203.49"
    className="h-80 col-span-2"
    {...props}
  >
    <FemaleBackBodyMapMusclePart1 />
    <FemaleBackBodyMapMusclePart2 />
  </svg>
);
export default SVGComponent;
