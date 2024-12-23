/* eslint-disable react-hooks/exhaustive-deps */
import { ChangeEvent, useEffect, useState } from "react";
import { FieldValues, UseFormRegister } from "react-hook-form";

export interface IInputNumberProps {
  disabled: boolean;
  register: UseFormRegister<FieldValues | any>;
  registerName: string;
  onBlur?: Function;
  initValue: number;
  textPosition?: "right" | "left";
  toFixed?: number;
  borderColor?: string;
  maxLength?: number;
  id?: string;
  onKeyDown?: Function;
}

const InputNumber = ({
  disabled,
  register,
  registerName,
  onBlur,
  initValue,
  textPosition = "right",
  toFixed = 4,
  borderColor = null,
  maxLength = null,
  id = null,
  onKeyDown,
}: IInputNumberProps) => {
  const parseCommaAndToFixedString = (value: number) => {
    if (isNaN(value)) return toFixed === 4 ? "0.0000" : "0.00";
    return Number(value?.toFixed(toFixed)).toLocaleString("en-US", {
      minimumFractionDigits: toFixed,
      maximumFractionDigits: toFixed,
    });
  };

  const parseCommaAndToFixedValue = (value: string) => {
    if (!value) return 0;

    const numberString = value?.replace(/,/g, "");
    const numberValue = parseFloat(numberString);
    return numberValue;
  };

  const addCommas = (num: string) => {
    const [integerPart, decimalPart] = num.split(".");
    const formattedIntegerPart = integerPart.replace(
      /\B(?=(\d{3})+(?!\d))/g,
      ","
    );
    return decimalPart
      ? `${formattedIntegerPart}.${decimalPart}`
      : formattedIntegerPart;
  };

  const [inputValue, setInputValue] = useState(addCommas("0.00"));

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    let inputValue = e.target.value;

    inputValue = inputValue.replace(/[^0-9.-]/g, "");

    const negativeSignCount = (inputValue.match(/-/g) || []).length;
    if (
      negativeSignCount > 1 ||
      (negativeSignCount === 1 && inputValue.indexOf("-") > 0)
    ) {
      inputValue = inputValue.replace(/-/g, "");
    }

    inputValue = inputValue.replace(/^0+(?=[1-9])/, "");

    const parts = inputValue.split(".");
    if (parts.length > 1) {
      parts[1] = parts[1].slice(0, toFixed);
      inputValue = parts.join(".");
    }

    const dotCount = inputValue.split(".").length - 1;
    if (dotCount > 1) {
      inputValue = inputValue.substr(0, inputValue.lastIndexOf("."));
    }

    if (inputValue.startsWith(".")) {
      inputValue = inputValue.replace(/^\.+/g, "");
    }

    setInputValue(inputValue);
  };

  useEffect(() => {
    setInputValue(parseCommaAndToFixedString(initValue));
  }, [initValue, toFixed]);

  return (
    <input
      id={id || "input_number"}
      data-testid="input_number"
      disabled={disabled}
      key={registerName}
      {...register(registerName)}
      name={registerName}
      type="text"
      placeholder={toFixed === 4 ? "0.0000" : toFixed === 3 ? "0.000" : "0.00"}
      className={`h-[44px] w-full truncate rounded-lg border ${
        borderColor !== null ? borderColor : "border-outline-grey"
      } bg-white-surface px-4 py-2.5
      text-${textPosition} placeholder-text-lighter-400 disabled:border-disable/light-outline-disable-light 
                disabled:bg-disable/light-disable-light disabled:text-disable/light-on-disable-light`}
      onChange={handleChange}
      onBlur={(e) => {
        const value = e.target.value;
        const numValue = parseFloat(value.replace(/,/g, ""));

        if (maxLength !== null && numValue > maxLength) {
          // Clear value
          setInputValue(parseCommaAndToFixedString(maxLength));
          if (onBlur) onBlur(maxLength);
          return;
        }
        if (onBlur) onBlur(value || String(initValue));
        setInputValue(
          parseCommaAndToFixedString(parseCommaAndToFixedValue(inputValue))
        );
      }}
      onKeyDown={(e) => {
        if (onKeyDown) {
          onKeyDown(inputValue || String(initValue));
        }
      }}
      onFocus={(e) => {
        e.target.value = "";
      }}
      value={inputValue}
    />
  );
};

export default InputNumber;
