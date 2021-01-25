import GenericField from './generic';

/**
 * Boolean field
 */
class BooleanField extends GenericField {
  value: boolean;

  setValue(value: string | boolean) {
    this.value = value === 'true' || value === true;

    return this;
  }
}

export default BooleanField;
