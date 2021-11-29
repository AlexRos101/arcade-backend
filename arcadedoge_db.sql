-- phpMyAdmin SQL Dump
-- version 5.0.2
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Nov 13, 2021 at 11:37 AM
-- Server version: 10.4.11-MariaDB
-- PHP Version: 7.4.4

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `arcadedoge_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `tbl_category`
--

CREATE TABLE `tbl_category` (
  `id` int(11) NOT NULL,
  `game_id` int(11) NOT NULL,
  `name` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Dumping data for table `tbl_category`
--

INSERT INTO `tbl_category` (`id`, `game_id`, `name`, `created_at`, `updated_at`) VALUES
(1, 1, 'MarsDoge Skins', '2021-09-26 14:58:19', '2021-09-26 14:58:19'),
(2, 1, 'MarsDoge Maps', '2021-09-26 14:58:19', '2021-09-26 14:58:19'),
(3, 1, 'Weapons', '2021-09-26 14:58:36', '2021-09-26 14:58:36'),
(4, 2, 'Category 1', '2021-09-26 15:46:34', '2021-09-26 15:46:34'),
(5, 2, 'Category 2', '2021-09-26 15:46:34', '2021-09-26 15:46:34');

-- --------------------------------------------------------

--
-- Table structure for table `tbl_comment`
--

CREATE TABLE `tbl_comment` (
  `id` int(11) NOT NULL,
  `discussion_id` int(255) NOT NULL,
  `parent_id` int(255) NOT NULL,
  `content` text NOT NULL,
  `user` varchar(255) NOT NULL,
  `user_type` int(1) NOT NULL COMMENT '// 0: normal, 1: anonymous',
  `likes` int(255) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_discussion`
--

CREATE TABLE `tbl_discussion` (
  `id` int(255) NOT NULL,
  `stuff_id` int(255) NOT NULL,
  `content` text NOT NULL,
  `user` varchar(255) NOT NULL,
  `user_type` int(1) NOT NULL COMMENT '// 0: normal, 1: anonymous',
  `likes` int(255) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_game`
--

CREATE TABLE `tbl_game` (
  `id` int(11) NOT NULL,
  `name` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Dumping data for table `tbl_game`
--

INSERT INTO `tbl_game` (`id`, `name`, `created_at`, `updated_at`) VALUES
(1, 'MarsDoge', '2021-09-26 14:57:30', '2021-09-26 14:57:30'),
(2, 'Another Game', '2021-09-26 15:46:14', '2021-09-26 15:46:14');

-- --------------------------------------------------------

--
-- Table structure for table `tbl_history`
--

CREATE TABLE `tbl_history` (
  `id` int(11) NOT NULL,
  `txid` varchar(128) COLLATE utf8_unicode_ci NOT NULL,
  `game_id` int(11) DEFAULT NULL,
  `token_id` int(11) DEFAULT NULL,
  `from_address` varchar(128) COLLATE utf8_unicode_ci NOT NULL,
  `to_address` varchar(128) COLLATE utf8_unicode_ci NOT NULL,
  `asset_id` varchar(128) COLLATE utf8_unicode_ci DEFAULT NULL,
  `token_amount` varchar(32) COLLATE utf8_unicode_ci DEFAULT NULL,
  `gamepoint_amount` int(11) DEFAULT NULL,
  `type` int(11) NOT NULL DEFAULT 0 COMMENT '1: mint, 2: exchange, 3: burn, 4: transfer,\r\n5: deposit(token->gamepoint), 6: withdraw(gamepoint->token)',
  `block_timestamp` bigint(13) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_item`
--

CREATE TABLE `tbl_item` (
  `id` int(11) NOT NULL,
  `game_id` int(11) NOT NULL,
  `category_id` int(11) NOT NULL,
  `contract_address` varchar(128) COLLATE utf8_unicode_ci NOT NULL,
  `token_id` bigint(13) NOT NULL,
  `name` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `description` text COLLATE utf8_unicode_ci NOT NULL,
  `attach_url` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `owner` varchar(128) COLLATE utf8_unicode_ci NOT NULL,
  `is_anonymous` int(11) NOT NULL DEFAULT 0 COMMENT '0: anonymous, 1: none-anonymous',
  `arcadedoge_price` double NOT NULL DEFAULT 0,
  `is_visible` int(11) NOT NULL DEFAULT 0 COMMENT '0: hidden, 1: visible',
  `is_burnt` int(11) NOT NULL DEFAULT 0 COMMENT '0: none-burnt, 1: burnt',
  `trade_cnt` int(11) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_likes`
--

CREATE TABLE `tbl_likes` (
  `id` int(11) NOT NULL,
  `discussion_id` int(255) NOT NULL,
  `parent_id` int(255) NOT NULL,
  `user` varchar(255) NOT NULL,
  `user_type` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_status`
--

CREATE TABLE `tbl_status` (
  `id` int(11) NOT NULL,
  `contract_type` int(11) NOT NULL COMMENT '1: NFT, 2: EXCHANGE, 3: SWAP',
  `block_number` int(11) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Dumping data for table `tbl_status`
--

INSERT INTO `tbl_status` (`id`, `contract_type`, `block_number`, `created_at`, `updated_at`) VALUES
(1, 1, 0, '0000-00-00 00:00:00', '2021-11-12 21:05:37'),
(2, 2, 0, '0000-00-00 00:00:00', '2021-11-13 17:09:17'),
(3, 3, 0, '2021-11-13 13:31:24', '2021-11-13 18:23:31');

-- --------------------------------------------------------

--
-- Table structure for table `tbl_stuff`
--

CREATE TABLE `tbl_stuff` (
  `id` int(255) NOT NULL,
  `title` varchar(1024) CHARACTER SET utf8 NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `tbl_category`
--
ALTER TABLE `tbl_category`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `tbl_comment`
--
ALTER TABLE `tbl_comment`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `tbl_discussion`
--
ALTER TABLE `tbl_discussion`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `tbl_game`
--
ALTER TABLE `tbl_game`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `tbl_history`
--
ALTER TABLE `tbl_history`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `tbl_item`
--
ALTER TABLE `tbl_item`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `tbl_likes`
--
ALTER TABLE `tbl_likes`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `tbl_status`
--
ALTER TABLE `tbl_status`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `tbl_stuff`
--
ALTER TABLE `tbl_stuff`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `tbl_category`
--
ALTER TABLE `tbl_category`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `tbl_comment`
--
ALTER TABLE `tbl_comment`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_discussion`
--
ALTER TABLE `tbl_discussion`
  MODIFY `id` int(255) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_game`
--
ALTER TABLE `tbl_game`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `tbl_history`
--
ALTER TABLE `tbl_history`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_item`
--
ALTER TABLE `tbl_item`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_likes`
--
ALTER TABLE `tbl_likes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_status`
--
ALTER TABLE `tbl_status`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `tbl_stuff`
--
ALTER TABLE `tbl_stuff`
  MODIFY `id` int(255) NOT NULL AUTO_INCREMENT;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
