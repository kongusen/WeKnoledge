from typing import Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr, UUID4

# 共享属性
class UserBase(BaseModel):
    email: Optional[EmailStr] = None
    username: Optional[str] = None
    is_active: Optional[bool] = True
    is_superuser: Optional[bool] = False
    full_name: Optional[str] = None
    department: Optional[str] = None
    avatar: Optional[str] = None

# 创建用户时的属性
class UserCreate(UserBase):
    email: EmailStr
    username: str
    password: str

# 更新用户时的属性
class UserUpdate(UserBase):
    password: Optional[str] = None

# 数据库中的用户信息
class UserInDBBase(UserBase):
    id: UUID4
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# 返回给API的用户信息
class User(UserInDBBase):
    pass

# 数据库中存储的用户信息，包含密码
class UserInDB(UserInDBBase):
    hashed_password: str 