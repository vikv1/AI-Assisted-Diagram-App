import clsx from "clsx";

import "./ToolIcon.scss";

import { AIIcon } from "./icons";

import type { ToolButtonSize } from "./ToolButton";

type AIIconProps = {
  title?: string;
  name?: string;
  checked: boolean;
  onChange?(): void;
  isMobile?: boolean;
};

const DEFAULT_SIZE: ToolButtonSize = "medium";

const ICONS = {
  CHECKED: AIIcon,
  UNCHECKED: AIIcon,
};

export const AIButton = (props: AIIconProps) => {
  return (
    <label
      className={clsx(
        "ToolIcon ToolIcon__ai",
        `ToolIcon_size_${DEFAULT_SIZE}`,
        {
          "is-mobile": props.isMobile,
        },
      )}
      title={`${props.title} — A`}
    >
      <input
        className="ToolIcon_type_checkbox"
        type="checkbox"
        name={props.name}
        onChange={props.onChange}
        checked={props.checked}
        aria-label={props.title}
        data-testid="toolbar-ai"
      />
      <div className="ToolIcon__icon">
        {props.checked ? ICONS.CHECKED : ICONS.UNCHECKED}
      </div>
    </label>
  );
};
