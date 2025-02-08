export interface JAnchorProps {
  /**
   * Reference position to use. The real position might differ
   * from the real one, since the component will be repositioned
   * automatically if it doesn't fit properly in the screen.
   */
  position: 'top' | 'bottom' | 'left' | 'right';
}
