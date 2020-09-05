const imageHelper = {
  methods: {
    /**
     * returns a URL with the link to the image
     * @param id itemId to get image for
     * @param type type of image (primary/backdrop)
     * @returns URL of the link to the image
     */
    getImageLink(id: string, type: string): string {
      return `${this.$axios.defaults.baseURL}/Items/${id}/Images/${type}`;
    }
  }
};

export default imageHelper;
