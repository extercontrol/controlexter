<template>
    <ul class="accordion">
      <slot></slot>
    </ul>
  </template>
  
  <script lang="ts">
  import { defineComponent } from 'vue'
  export default defineComponent({
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
  });
  </script>
  
  <style lang="css" scoped>
  .accordion {
    list-style: none;
    margin: 0;
    padding: 0;
  
  }
  </style>
  