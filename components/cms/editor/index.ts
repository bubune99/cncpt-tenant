/**
 * Atlas A2 Editor Components — public exports.
 * TipTapEditor + EditorToolbar are owned by A4; do NOT export them here.
 */

export { PageSettingsEditor } from './PageSettingsEditor';
export type { PageForEditor, PageSettingsEditorProps } from './PageSettingsEditor';

export { OrderEditor } from './OrderEditor';
export type {
  OrderData,
  OrderEditorProps,
  OrderLineItem,
  SubStep,
  SubStepState,
  OrderAttachment,
  ConfigOption,
  OrderCustomer,
  OrderShipping,
  OrderNote,
  OrderTag,
  OrderTotalLine,
} from './OrderEditor';

export { CustomerEditor } from './CustomerEditor';
export type {
  CustomerData,
  CustomerEditorProps,
  CustomerOrderRow,
  CustomerAddress,
  CustomerSegment,
  ActivityEntry,
  LifecycleStage,
} from './CustomerEditor';

export {
  Crumbs,
  EditorTabs,
  Sec,
  SaveBar,
  FieldRow,
  InputRow,
  StatBrick,
  Pill,
  TimelineItem,
  Avatar,
} from './EditorPrimitives';
export type {
  CrumbItem,
  EditorTabItem,
  SaveBarHint,
  PillVariant,
} from './EditorPrimitives';
