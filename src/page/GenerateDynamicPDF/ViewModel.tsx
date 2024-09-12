import { useGenerateDynamicPDFContext } from "./context";

const ViewModel = () => {
  const { deltaPosition, setDeltaPosition, position, setPosition } =
    useGenerateDynamicPDFContext();
  return { deltaPosition, setDeltaPosition, position, setPosition };
};

export default ViewModel;
