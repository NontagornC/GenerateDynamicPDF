import { Routes, Route } from "react-router-dom";
import DynamicGeneratePDF from "@/page/GenerateDynamicPDF/View";

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
