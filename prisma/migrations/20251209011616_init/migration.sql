BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[User] (
    [id] INT NOT NULL IDENTITY(1,1),
    [username] NVARCHAR(1000) NOT NULL,
    [password] NVARCHAR(1000) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [User_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [User_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [User_username_key] UNIQUE NONCLUSTERED ([username])
);

-- CreateTable
CREATE TABLE [dbo].[Category] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(1000) NOT NULL,
    [type] NVARCHAR(1000) NOT NULL,
    [userId] INT NOT NULL,
    CONSTRAINT [Category_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Account] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(1000) NOT NULL,
    [userId] INT NOT NULL,
    CONSTRAINT [Account_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Transaction] (
    [id] INT NOT NULL IDENTITY(1,1),
    [amount] FLOAT(53) NOT NULL,
    [type] NVARCHAR(1000) NOT NULL,
    [time] DATETIME2 NOT NULL,
    [note] NVARCHAR(1000),
    [categoryId] INT NOT NULL,
    [accountId] INT NOT NULL,
    [userId] INT NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Transaction_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [Transaction_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Category_userId_idx] ON [dbo].[Category]([userId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Account_userId_idx] ON [dbo].[Account]([userId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Transaction_time_idx] ON [dbo].[Transaction]([time]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Transaction_categoryId_idx] ON [dbo].[Transaction]([categoryId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Transaction_accountId_idx] ON [dbo].[Transaction]([accountId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Transaction_userId_idx] ON [dbo].[Transaction]([userId]);

-- AddForeignKey
ALTER TABLE [dbo].[Category] ADD CONSTRAINT [Category_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Account] ADD CONSTRAINT [Account_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Transaction] ADD CONSTRAINT [Transaction_categoryId_fkey] FOREIGN KEY ([categoryId]) REFERENCES [dbo].[Category]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Transaction] ADD CONSTRAINT [Transaction_accountId_fkey] FOREIGN KEY ([accountId]) REFERENCES [dbo].[Account]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Transaction] ADD CONSTRAINT [Transaction_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
