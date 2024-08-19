import { Routes, Route } from "react-router-dom";

const index = () => {
  return (
    <>
      <Routes>
        <Route path="/" element={<div>hello home</div>} />
        <Route path="/mock page 2" element={<div>mock page 2</div>} />
      </Routes>
    </>
  );
};

export default index;
