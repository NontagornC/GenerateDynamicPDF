/* eslint-disable react-hooks/exhaustive-deps */
import { ChangeEvent, useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import styled from "styled-components";

interface IUploadButtonProps {
  value: File;
  onChangeExceedFileSize: () => void;
  onChangeNotExceedFileSize: (value) => void;
  onInvalidFileType: () => void;
  onDeleteFile: () => void;
  maxFileSize?: number;
  maxWidth?: number;
  accecptFilesArray?: string[];
  isS3PathPreview?: boolean;
  s3File?: string;
  isHideMarginTop?: boolean;
}

interface IContainerProps {
  maxWidth: number;
}

const View = ({
  value,
  onChangeExceedFileSize,
  onChangeNotExceedFileSize,
  onInvalidFileType,
  maxFileSize = 1024 * 1024,
  onDeleteFile,
  maxWidth = 160,
  accecptFilesArray = ["jpg", "jpeg", "png"],
  isS3PathPreview = false,
  s3File = "",
  isHideMarginTop = true,
}: IUploadButtonProps) => {
  const inputRef = useRef(null);
  const dispatch = useDispatch();
  const [useFile, setFile] = useState<File>(null);

  const onChooseFile = () => {
    inputRef.current.click();
  };

  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    const fileSize = event?.target?.files[0]?.size;
    const fileType = event?.target?.files[0]?.type?.split("/")[1];
    if (!accecptFilesArray.includes(fileType)) {
      onInvalidFileType && onInvalidFileType();
      return;
    }
    if (fileSize > maxFileSize) {
      onChangeExceedFileSize && onChangeExceedFileSize();
    } else {
      onChangeNotExceedFileSize &&
        onChangeNotExceedFileSize(event.target.files[0]);
      return;
    }
  };

  useEffect(() => {
    if (value) {
      setFile(value);
    }
  }, []);

  return (
    <>
      {!useFile ? (
        <>
          <Container
            maxWidth={maxWidth}
            onClick={onChooseFile}
            className="flex w-full cursor-pointer items-center justify-center rounded-lg border border-outline-grey bg-info-state-on-default px-4 py-[10px] font-semibold leading-6"
          >
            อัปโหลดรูปภาพ
          </Container>
          <input
            type="file"
            ref={inputRef}
            style={{ display: "none" }}
            onChange={onChange}
            accept=".jpg, .jpeg, .png"
          />
        </>
      ) : (
        <Container
          maxWidth={maxWidth}
          className={`${
            !isHideMarginTop && "mt-2"
          } flex flex-1 items-center justify-center gap-4 truncate rounded-lg leading-6 text-link-normal underline`}
        >
          <div className="flex w-full flex-1 items-center truncate">
            <span onClick={() => {}} className="cursor-pointer truncate">
              {useFile?.name || "-"}
            </span>
          </div>
          <div
            onClick={onDeleteFile}
            className="flex min-h-6 min-w-6 cursor-pointer items-center justify-between"
          >
            {CloseIcon()}
          </div>
        </Container>
      )}
    </>
  );
};

const Container = styled.div<IContainerProps>`
  max-width: ${(props) => (props.maxWidth ? `${props.maxWidth}px` : "160px")};
`;

const CloseIcon = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M17.6569 6.34336C18.004 6.69049 18.004 7.2533 17.6569 7.60044L13.2571 12.0002L17.6569 16.4C18.004 16.7471 18.004 17.3099 17.6569 17.6571C17.3097 18.0042 16.7469 18.0042 16.3998 17.6571L12 13.2573L7.60025 17.6571C7.25312 18.0042 6.69031 18.0042 6.34317 17.6571C5.99604 17.3099 5.99604 16.7471 6.34317 16.4L10.7429 12.0002L6.34317 7.60044C5.99604 7.2533 5.99604 6.69049 6.34317 6.34336C6.69031 5.99622 7.25312 5.99622 7.60025 6.34336L12 10.7431L16.3998 6.34336C16.7469 5.99622 17.3097 5.99622 17.6569 6.34336Z"
        fill="#667085"
      />
    </svg>
  );
};

export default View;
