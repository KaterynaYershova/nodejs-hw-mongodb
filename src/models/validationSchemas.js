import Joi from "joi";

export const contactSchema = Joi.object({
    name: Joi.string().min(3).max(20).required()
      .messages({
        'string.base': 'Ім\'я повинно бути рядком',
        'string.min': 'Ім\'я повинно містити мінімум 3 символи',
        'string.max': 'Ім\'я повинно містити не більше 20 символів',
        'any.required': 'Ім\'я є обов\'язковим полем',
      }),
    email: Joi.string().email().required()
      .messages({
        'string.email': 'Будь ласка, введіть дійсну електронну адресу',
        'any.required': 'Електронна адреса є обов\'язковим полем',
      }),
    phone: Joi.string().min(3).max(20).required()
      .messages({
        'string.base': 'Телефон повинен бути рядком',
        'string.min': 'Телефон повинен містити мінімум 3 символи',
        'string.max': 'Телефон повинен містити не більше 20 символів',
        'any.required': 'Номер телефону є обов\'язковим полем',
      }),
    isFavourite: Joi.boolean()
      .messages({
        'boolean.base': 'Значення поля "обраний" повинно бути булевим',
      }),
    contactType: Joi.string().valid('work', 'personal', 'other')
      .messages({
        'any.only': 'Тип контакту повинен бути одним із: work, personal, other',
      }),
  });
