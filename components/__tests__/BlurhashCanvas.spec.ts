import { shallowMount, Wrapper } from '@vue/test-utils';
import BlurhashCanvas from '~/components/BlurhashCanvas.vue';

let wrapper: Wrapper<Vue>;

beforeEach(() => {
  wrapper = shallowMount(BlurhashCanvas, {
    propsData: {
      hash: 'L7F$k?_*41GX^]KhTnJ8G?OXvz#;'
    }
  });
});

describe('BlurhashCanvas', () => {
  test('has a hash property of type String', () => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    expect(wrapper.vm.$options.props.hash).toBeDefined();
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    expect(wrapper.vm.$options.props.hash.type).toBe(String);
  });

  test('has a width property of type Number', () => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    expect(wrapper.vm.$options.props.width).toBeDefined();
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    expect(wrapper.vm.$options.props.width.type).toBe(Number);
  });

  test('has a height property of type Number', () => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    expect(wrapper.vm.$options.props.height).toBeDefined();
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    expect(wrapper.vm.$options.props.height.type).toBe(Number);
  });

  test('has a punch property of type Number', () => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    expect(wrapper.vm.$options.props.punch).toBeDefined();
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    expect(wrapper.vm.$options.props.punch.type).toBe(Number);
  });

  test('requires a hash', () => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    expect(wrapper.vm.$options.props.hash.required).toBeTruthy();
  });

  test('has a default width and height', () => {
    expect(wrapper.props().width).toBe(32);
    expect(wrapper.props().height).toBe(32);
  });

  test('has a default punch', () => {
    expect(wrapper.props().punch).toBe(1);
  });
});
