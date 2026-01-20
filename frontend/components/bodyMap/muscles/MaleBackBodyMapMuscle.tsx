import * as React from "react";
import { MaleBackBodyMapMusclePart1 } from "./maleBack/MaleBackBodyMapMusclePart1";
import { MaleBackBodyMapMusclePart2 } from "./maleBack/MaleBackBodyMapMusclePart2";
const SVGComponent = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 676.49 1203.49"
    className="h-80 col-span-2"
    {...props}
  >
    <MaleBackBodyMapMusclePart1 />
    <MaleBackBodyMapMusclePart2 />
  </svg>
);
export default SVGComponent;
