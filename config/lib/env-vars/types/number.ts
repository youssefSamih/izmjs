import GenericField from './generic';
/**
 * Object field
 */
class NumberField extends GenericField {
  setValue(value: any) {
    this.value = Number.isNaN(value) ? null : +value;

    return this;
  }
}

export default NumberField;
