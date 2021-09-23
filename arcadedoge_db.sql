-- phpMyAdmin SQL Dump
-- version 5.0.2
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- 생성 시간: 21-09-22 09:38
-- 서버 버전: 10.4.11-MariaDB
-- PHP 버전: 7.4.4

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- 데이터베이스: `arcadedoge_db`
--

-- --------------------------------------------------------

--
-- 테이블 구조 `tbl_comment`
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

--
-- 테이블의 덤프 데이터 `tbl_comment`
--

INSERT INTO `tbl_comment` (`id`, `discussion_id`, `parent_id`, `content`, `user`, `user_type`, `likes`, `created_at`, `updated_at`) VALUES
(1, 2, -1, 'Cottage cheese taleggio mascarpone. Cheesy feet chalk and cheese everyone loves paneer smelly cheese jarlsberg blue castello feta...', '', 1, 22345, '2021-09-21 13:27:02', '2021-09-21 13:27:02'),
(2, 2, -1, 'Cottage cheese taleggio mascarpone. Cheesy feet chalk and cheese everyone loves paneer smelly cheese jarlsberg blue castello feta...', '', 1, 22345, '2021-09-21 13:27:02', '2021-09-21 13:27:02'),
(3, 2, 2, 'Cottage cheese taleggio mascarpone. Cheesy feet chalk and cheese everyone loves paneer smelly cheese jarlsberg blue castello feta...', '', 1, 22345, '2021-09-21 13:27:59', '2021-09-21 13:27:59'),
(4, 2, 2, 'Cottage cheese taleggio mascarpone. Cheesy feet ch...', '', 1, 12, '2021-09-21 13:49:40', '2021-09-21 13:49:40'),
(5, 2, 2, 'Cottage cheese taleggio mascarpone. Cheesy feet ch...', '', 1, 10, '2021-09-21 13:50:03', '2021-09-21 13:50:03'),
(6, 2, 3, 'Cottage cheese taleggio mascarpone. Cheesy feet ch...', '', 1, 1, '2021-09-21 13:50:32', '2021-09-21 13:50:32'),
(7, 2, 3, 'Cottage cheese taleggio mascarpone. Cheesy feet ch...', '', 1, 1, '2021-09-21 13:50:32', '2021-09-21 13:50:32');

-- --------------------------------------------------------

--
-- 테이블 구조 `tbl_discussion`
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

--
-- 테이블의 덤프 데이터 `tbl_discussion`
--

INSERT INTO `tbl_discussion` (`id`, `stuff_id`, `content`, `user`, `user_type`, `likes`, `created_at`, `updated_at`) VALUES
(1, 2, 'Cottage cheese taleggio mascarpone. Cheesy feet chalk and cheese everyone loves paneer smelly cheese jarlsberg blue castello feta cheese.', '', 1, 12, '2021-09-21 09:59:07', '2021-09-21 09:59:19'),
(2, 2, 'Cottage cheese taleggio mascarpone. Cheesy feet chalk and cheese everyone loves paneer smelly cheese jarlsberg blue castello feta cheese.', '', 1, 22345, '2021-09-21 10:00:09', '2021-09-21 10:00:09'),
(3, 2, 'Cottage cheese taleggio mascarpone. Cheesy feet chalk and cheese everyone loves paneer smelly cheese jarlsberg blue castello feta cheese.', '', 1, 12, '2021-09-21 10:00:09', '2021-09-21 10:00:09');

-- --------------------------------------------------------

--
-- 테이블 구조 `tbl_stuff`
--

CREATE TABLE `tbl_stuff` (
  `id` int(255) NOT NULL,
  `title` varchar(1024) CHARACTER SET utf8 NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- 테이블의 덤프 데이터 `tbl_stuff`
--

INSERT INTO `tbl_stuff` (`id`, `title`, `created_at`, `updated_at`) VALUES
(1, 'ArcadeDoge General Stuff', '2021-09-21 09:57:25', '2021-09-21 09:57:50'),
(2, 'MarsDoge', '2021-09-21 09:57:25', '2021-09-21 09:57:25');

--
-- 덤프된 테이블의 인덱스
--

--
-- 테이블의 인덱스 `tbl_comment`
--
ALTER TABLE `tbl_comment`
  ADD PRIMARY KEY (`id`);

--
-- 테이블의 인덱스 `tbl_discussion`
--
ALTER TABLE `tbl_discussion`
  ADD PRIMARY KEY (`id`);

--
-- 테이블의 인덱스 `tbl_stuff`
--
ALTER TABLE `tbl_stuff`
  ADD PRIMARY KEY (`id`);

--
-- 덤프된 테이블의 AUTO_INCREMENT
--

--
-- 테이블의 AUTO_INCREMENT `tbl_comment`
--
ALTER TABLE `tbl_comment`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- 테이블의 AUTO_INCREMENT `tbl_discussion`
--
ALTER TABLE `tbl_discussion`
  MODIFY `id` int(255) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- 테이블의 AUTO_INCREMENT `tbl_stuff`
--
ALTER TABLE `tbl_stuff`
  MODIFY `id` int(255) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
