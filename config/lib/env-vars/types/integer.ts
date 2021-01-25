import GenericField from './generic';

/**
 * Object field
 */
class IntegerField extends GenericField {
  setValue(value: any) {
    this.value = Number.isNaN(value) ? null : parseInt(value, 10);

    return this;
  }
}

export default IntegerField;
