import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Role } from '../../common/roles.enum';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  username!: string;

  @Prop({
    required: false,
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true,
  })
  email?: string;

  @Prop({ required: true })
  passwordHash!: string;

  @Prop({ required: true, enum: Role, default: Role.Student })
  role!: Role;

  @Prop({ required: false })
  schoolId?: string;

  @Prop({ required: true, default: true })
  isActive!: boolean;

  @Prop({ required: false })
  refreshTokenHash?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
