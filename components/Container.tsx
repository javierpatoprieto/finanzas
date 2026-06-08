import { CSSProperties, HTMLAttributes } from "react";
import styles from "./Container.module.css";

type Props = HTMLAttributes<HTMLDivElement> & {
  as?: keyof React.JSX.IntrinsicElements;
  full?: boolean;
};

export function Container({ as: Tag = "div", full, className, style, ...rest }: Props) {
  const Component = Tag as React.ElementType;
  return (
    <Component
      className={[styles.container, full && styles.full, className]
        .filter(Boolean)
        .join(" ")}
      style={style as CSSProperties}
      {...rest}
    />
  );
}
