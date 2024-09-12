import ViewModel from "./ViewModel";

const View = () => {
  const { generatePDF } = ViewModel();
  return (
    <div className=" flex min-h-full min-w-[300px] flex-col rounded-3xl bg-slate-300 p-6">
      <button
        onClick={() => {
          generatePDF();
        }}
      >
        Click to Export
      </button>
    </div>
  );
};

export default View;
