import { h, Suspense, defineComponent, type Component } from 'vue';
import { Dialog, QDialog, QSpinner, useDialogPluginComponent } from 'quasar';

export interface AsyncDialogProps<TPayload = void> {
  onDialogOK?: (payload?: TPayload) => void;
  onDialogCancel?: () => void;
  onDialogHide?: () => void;
}

export async function showAsyncDialog<
  TProps extends Record<string, unknown> = Record<string, unknown>,
  TReturn = unknown
>(
  asyncComponent: Component,
  componentProps?: TProps
): Promise<TReturn | undefined> {
  const InlineAsyncWrapper = defineComponent({
    name: 'InlineAsyncWrapper',
    props: {
      innerComponent: { type: Object, required: true },
      innerProps: { type: Object, default: () => ({}) },
    },
    emits: [...useDialogPluginComponent.emits],
    setup(props) {
      const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
        useDialogPluginComponent();

      return () =>
        h(
          QDialog,
          {
            ref: dialogRef,
            onHide: onDialogHide,
          },
          {
            default: () =>
              h(Suspense, null, {
                default: () =>
                  h(props.innerComponent, {
                    class: 'q-dialog-plugin',
                    onDialogHide,
                    onDialogOK,
                    onDialogCancel,
                    ...props.innerProps,
                  }),
                fallback: () =>
                  h('div', { class: 'q-pa-xl flex flex-center' }, [
                    h(QSpinner, { color: 'primary', size: '5em' }),
                  ]),
              }),
          }
        );
    },
  });

  return new Promise<TReturn | undefined>((resolve) => {
    Dialog.create({
      component: InlineAsyncWrapper,
      componentProps: {
        innerComponent: asyncComponent,
        innerProps: componentProps,
      },
    })
      .onOk((payload: TReturn) => resolve(payload))
      .onCancel(() => resolve(undefined));
  });
}
