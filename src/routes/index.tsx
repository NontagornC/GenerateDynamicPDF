import { Routes, Route } from "react-router-dom";
import DynamicGeneratePDF from "@/components/GenerateDynamicPDF/View";

const index = () => {
  return (
    <>
      <Routes>
        <Route path="/" element={<DynamicGeneratePDF />} />
      </Routes>
    </>
  );
};

export default index;
