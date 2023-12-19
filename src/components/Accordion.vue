<template>
    <ul class="accordion">
      <slot></slot>
    </ul>
  </template>
  
  <script>
  export default {
    props: {
      count: {
        type: Number,
        default: 0,
      },
      active: {
        type: [Number, null], // Allow null
        default: null,
      },
    },
    data() {
      return {
        Accordion: {
          count: 0,
          active: null
        }
      };
    },
    provide() {
      return { Accordion: this.Accordion };
    }
  };
  </script>
  
  <style lang="css" scoped>
  .accordion {
    list-style: none;
    margin: 0;
    padding: 0;
  
  }
  </style>
  